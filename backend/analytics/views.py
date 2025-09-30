# analytics/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import AnalyticsService

@api_view(['GET'])
def word_frequency(request):
    """Get word frequency statistics"""
    limit = int(request.GET.get('limit', 20))
    data = AnalyticsService.get_word_frequency(limit)
    return Response(data)

@api_view(['GET'])
def corpus_statistics(request):
    """Get comprehensive corpus statistics"""
    data = AnalyticsService.get_corpus_statistics()
    return Response(data)

@api_view(['GET'])
def usage_statistics(request):
    """Get usage statistics"""
    data = AnalyticsService.get_usage_statistics()
    return Response(data)

@api_view(['GET'])
def analytics_dashboard(request):
    """Get all analytics data for dashboard"""
    return Response({
        'word_frequency': AnalyticsService.get_word_frequency(10),
        'corpus_statistics': AnalyticsService.get_corpus_statistics(),
        'usage_statistics': AnalyticsService.get_usage_statistics(),
    })