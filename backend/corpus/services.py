# corpus/services.py
import logging
from django.db import transaction
from django.db.models import Q
from .models import CulturalEntry, ActivityLog

logger = logging.getLogger('corpus')

class SearchService:
    """Service class for search operations - Low coupling"""
    
    @staticmethod
    def search_entries(query, filters=None):
        """
        Search cultural entries with given query and filters
        """
        try:
            search_query = Q(is_active=True)
            
            if query:
                # Search across multiple fields
                text_query = Q(isiZulu_text__icontains=query) | \
                           Q(english_translation__icontains=query) | \
                           Q(cultural_context__icontains=query) | \
                           Q(examples__isiZulu_example__icontains=query) | \
                           Q(examples__english_example__icontains=query)
                search_query &= text_query
            
            # Apply additional filters
            if filters:
                search_query = SearchService._apply_filters(search_query, filters)
            
            results = CulturalEntry.objects.filter(search_query).distinct()
            
            # Update frequency for relevant entries
            SearchService._update_frequencies(results)
            
            return results
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            raise
    
    @staticmethod
    def _apply_filters(base_query, filters):
        """Apply additional filters to search query"""
        query = base_query
        
        if filters.get('part_of_speech'):
            query &= Q(part_of_speech=filters['part_of_speech'])
        
        if filters.get('genre'):
            query &= Q(genre=filters['genre'])
        
        if filters.get('language') == 'isizulu':
            query &= Q(isiZulu_text__icontains=filters.get('query', ''))
        elif filters.get('language') == 'english':
            query &= Q(english_translation__icontains=filters.get('query', ''))
        
        return query
    
    @staticmethod
    def _update_frequencies(entries):
        """Update frequency counts for searched entries"""
        for entry in entries:
            entry.frequency += 1
        CulturalEntry.objects.bulk_update(entries, ['frequency'])

class DataImportService:
    """Service class for data import operations"""
    
    @staticmethod
    @transaction.atomic
    def import_from_json(json_data, user=None):
        """
        Import cultural entries from JSON data
        """
        try:
            imported_count = 0
            
            for entry_data in json_data:
                # Validate required fields
                if not all(key in entry_data for key in ['isiZulu_text', 'english_translation']):
                    continue
                
                # Create entry
                entry = CulturalEntry.objects.create(
                    isiZulu_text=entry_data['isiZulu_text'],
                    english_translation=entry_data['english_translation'],
                    part_of_speech=entry_data.get('part_of_speech', 'cultural'),
                    genre=entry_data.get('genre', 'cultural'),
                    cultural_context=entry_data.get('cultural_context', ''),
                    source=entry_data.get('source', '')
                )
                
                # Create examples
                for example_data in entry_data.get('examples', []):
                    CulturalEntry.objects.create(
                        entry=entry,
                        isiZulu_example=example_data.get('isizulu', ''),
                        english_example=example_data.get('english', '')
                    )
                
                # Create additional translations
                for lang, translation in entry_data.get('additional_translations', {}).items():
                    CulturalEntry.objects.create(
                        entry=entry,
                        language=lang,
                        translation=translation
                    )
                
                imported_count += 1
            
            # Log activity
            ActivityLogService.log_activity(
                user=user,
                action='import',
                description=f"Imported {imported_count} entries from JSON"
            )
            
            return imported_count
            
        except Exception as e:
            logger.error(f"Import error: {str(e)}")
            raise

class ActivityLogService:
    """Service class for activity logging"""
    
    @staticmethod
    def log_activity(user=None, action='', description='', ip_address=None):
        """
        Log user activity
        """
        try:
            ActivityLog.objects.create(
                user=user,
                action=action,
                description=description,
                ip_address=ip_address
            )
        except Exception as e:
            logger.error(f"Activity log error: {str(e)}")

class StatisticsService:
    """Service class for statistical operations"""
    
    @staticmethod
    def get_basic_stats():
        """Get basic corpus statistics"""
        from django.db.models import Count, Avg
        
        stats = CulturalEntry.objects.aggregate(
            total_entries=Count('id'),
            active_entries=Count('id', filter=Q(is_active=True)),
            avg_frequency=Avg('frequency'),
            total_searches=Count('frequency')  # Approximation
        )
        
        return stats