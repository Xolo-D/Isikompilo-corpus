# corpus/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import CulturalEntry
from .serializers import CulturalEntrySerializer, CulturalEntryListSerializer
from .filters import CulturalEntryFilter
from .services import SearchService, DataImportService, ActivityLogService
from .pagination import StandardPagination

class CulturalEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing cultural entries
    """
    queryset = CulturalEntry.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CulturalEntryFilter
    search_fields = ['isiZulu_text', 'english_translation', 'cultural_context']
    ordering_fields = ['frequency', 'created_at', 'updated_at']
    ordering = ['-created_at']
    pagination_class = StandardPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CulturalEntryListSerializer
        return CulturalEntrySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Prefetch related data for efficiency
        if self.action in ['retrieve', 'list']:
            queryset = queryset.prefetch_related('examples', 'additional_translations')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save()
        ActivityLogService.log_activity(
            user=self.request.user,
            action='create',
            description=f"Created entry: {serializer.instance.isiZulu_text}",
            ip_address=self.get_client_ip()
        )
    
    def perform_update(self, serializer):
        serializer.save()
        ActivityLogService.log_activity(
            user=self.request.user,
            action='update',
            description=f"Updated entry: {serializer.instance.isiZulu_text}",
            ip_address=self.get_client_ip()
        )
    
    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()
        ActivityLogService.log_activity(
            user=self.request.user,
            action='delete',
            description=f"Deleted entry: {instance.isiZulu_text}",
            ip_address=self.get_client_ip()
        )
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced search endpoint
        """
        query = request.GET.get('q', '')
        filters = {
            'part_of_speech': request.GET.get('part_of_speech'),
            'genre': request.GET.get('genre'),
            'language': request.GET.get('language'),
            'query': query
        }
        
        try:
            results = SearchService.search_entries(query, filters)
            page = self.paginate_queryset(results)
            
            if page is not None:
                serializer = CulturalEntryListSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = CulturalEntryListSerializer(results, many=True)
            
            # Log search activity
            ActivityLogService.log_activity(
                user=request.user if request.user.is_authenticated else None,
                action='search',
                description=f"Searched for: {query}",
                ip_address=self.get_client_ip(request)
            )
            
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {'error': 'Search failed'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def import_data(self, request):
        """
        Import entries from JSON data
        """
        json_data = request.data
        
        if not isinstance(json_data, list):
            return Response(
                {'error': 'Data must be a list of entries'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            imported_count = DataImportService.import_from_json(
                json_data, 
                request.user
            )
            
            return Response({
                'message': f'Successfully imported {imported_count} entries',
                'imported_count': imported_count
            })
            
        except Exception as e:
            return Response(
                {'error': 'Import failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def export_data(self, request):
        """
        Export all entries as JSON
        """
        entries = CulturalEntry.objects.filter(is_active=True)
        serializer = CulturalEntrySerializer(entries, many=True)
        
        ActivityLogService.log_activity(
            user=request.user if request.user.is_authenticated else None,
            action='export',
            description="Exported corpus data",
            ip_address=self.get_client_ip(request)
        )
        
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip