# corpus/filters.py
import django_filters
from .models import CulturalEntry

class CulturalEntryFilter(django_filters.FilterSet):
    isiZulu_text = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by isiZulu text"
    )
    english_translation = django_filters.CharFilter(
        lookup_expr='icontains',
        help_text="Filter by English translation"
    )
    part_of_speech = django_filters.ChoiceFilter(
        choices=CulturalEntry.PART_OF_SPEECH_CHOICES
    )
    genre = django_filters.ChoiceFilter(
        choices=CulturalEntry.GENRE_CHOICES
    )
    min_frequency = django_filters.NumberFilter(
        field_name='frequency', 
        lookup_expr='gte'
    )
    max_frequency = django_filters.NumberFilter(
        field_name='frequency', 
        lookup_expr='lte'
    )
    
    class Meta:
        model = CulturalEntry
        fields = [
            'isiZulu_text', 'english_translation', 
            'part_of_speech', 'genre', 'frequency'
        ]