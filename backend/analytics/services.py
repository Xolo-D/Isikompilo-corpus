from django.db.models import Count, Avg, Max, Q
from corpus.models import CulturalEntry, ActivityLog

class AnalyticsService:
    """Service class for analytics operations"""
    
    @staticmethod
    def get_word_frequency(limit=20):
        """Get most frequent words in corpus"""
        from collections import Counter
        import re
        
        # Simple word frequency analysis
        all_text = ' '.join(
            CulturalEntry.objects.filter(is_active=True)
            .values_list('isiZulu_text', flat=True)
        )
        
        # Basic tokenization for isiZulu
        words = re.findall(r'\b\w+\b', all_text.lower())
        word_freq = Counter(words)
        
        return dict(word_freq.most_common(limit))
    
    @staticmethod
    def get_corpus_statistics():
        """Get comprehensive corpus statistics"""
        stats = CulturalEntry.objects.filter(is_active=True).aggregate(
            total_entries=Count('id'),
            total_proverbs=Count('id', filter=Q(genre='proverb')),
            total_idioms=Count('id', filter=Q(genre='idiom')),
            total_narratives=Count('id', filter=Q(genre='narrative')),
            total_songs=Count('id', filter=Q(genre='song')),
            avg_frequency=Avg('frequency'),
            max_frequency=Max('frequency'),
        )
        
        # Add word count statistics
        entries = CulturalEntry.objects.filter(is_active=True)
        total_words = sum(len(entry.isiZulu_text.split()) for entry in entries)
        unique_words = len(set(
            word for entry in entries 
            for word in entry.isiZulu_text.lower().split()
        ))
        
        stats.update({
            'total_words': total_words,
            'unique_words': unique_words,
            'average_word_length': total_words / max(stats['total_entries'], 1),
        })
        
        return stats
    
    @staticmethod
    def get_usage_statistics():
        """Get usage statistics"""
        recent_activities = ActivityLog.objects.filter(
            action__in=['search', 'view']
        ).count()
        
        total_searches = ActivityLog.objects.filter(action='search').count()
        total_views = ActivityLog.objects.filter(action='view').count()
        
        return {
            'recent_activities': recent_activities,
            'total_searches': total_searches,
            'total_views': total_views,
        }