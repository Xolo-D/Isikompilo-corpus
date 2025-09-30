# corpus/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class CulturalEntry(BaseModel):
    PART_OF_SPEECH_CHOICES = [
        ('noun', 'Noun'),
        ('verb', 'Verb'),
        ('adjective', 'Adjective'),
        ('adverb', 'Adverb'),
        ('proverb', 'Proverb'),
        ('idiom', 'Idiom'),
        ('narrative', 'Narrative'),
        ('song', 'Song'),
        ('greeting', 'Greeting'),
        ('cultural', 'Cultural Term'),
    ]
    
    GENRE_CHOICES = [
        ('proverb', 'Proverb'),
        ('idiom', 'Idiom'),
        ('narrative', 'Narrative'),
        ('song', 'Song'),
        ('greeting', 'Greeting'),
        ('cultural', 'Cultural'),
    ]
    
    # Core content (SRS 3.4, 4.1)
    isiZulu_text = models.TextField(
        validators=[MinLengthValidator(1)],
        help_text="Original isiZulu text"
    )
    english_translation = models.TextField(
        validators=[MinLengthValidator(1)],
        help_text="English translation"
    )
    
    # Linguistic metadata
    part_of_speech = models.CharField(
        max_length=20, 
        choices=PART_OF_SPEECH_CHOICES
    )
    genre = models.CharField(
        max_length=20, 
        choices=GENRE_CHOICES
    )
    
    # Cultural context
    cultural_context = models.TextField(
        help_text="Explanation of cultural significance"
    )
    source = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Source of the entry (e.g., traditional, book, interview)"
    )
    
    # Usage tracking
    frequency = models.IntegerField(
        default=0,
        help_text="How often this entry has been accessed"
    )
    
    # Active status
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'cultural_entries'
        indexes = [
            models.Index(fields=['isiZulu_text']),
            models.Index(fields=['english_translation']),
            models.Index(fields=['part_of_speech']),
            models.Index(fields=['genre']),
            models.Index(fields=['frequency']),
            models.Index(fields=['is_active']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.isiZulu_text} - {self.english_translation}"

class UsageExample(BaseModel):
    entry = models.ForeignKey(
        CulturalEntry, 
        on_delete=models.CASCADE, 
        related_name='examples'
    )
    isiZulu_example = models.TextField(
        validators=[MinLengthValidator(1)],
        help_text="Example usage in isiZulu"
    )
    english_example = models.TextField(
        validators=[MinLengthValidator(1)],
        help_text="Example usage in English"
    )
    
    class Meta:
        db_table = 'usage_examples'
        ordering = ['id']
    
    def __str__(self):
        return f"Example for {self.entry.isiZulu_text}"

class AdditionalTranslation(BaseModel):
    LANGUAGE_CHOICES = [
        ('isixhosa', 'isiXhosa'),
        ('sesotho', 'Sesotho'),
        ('setswana', 'Setswana'),
        ('tshivenda', 'Tshivenda'),
        ('xitsonga', 'Xitsonga'),
    ]
    
    entry = models.ForeignKey(
        CulturalEntry, 
        on_delete=models.CASCADE, 
        related_name='additional_translations'
    )
    language = models.CharField(
        max_length=20, 
        choices=LANGUAGE_CHOICES
    )
    translation = models.TextField(
        validators=[MinLengthValidator(1)]
    )
    
    class Meta:
        db_table = 'additional_translations'
        unique_together = ['entry', 'language']
        ordering = ['language']
    
    def __str__(self):
        return f"{self.language} translation for {self.entry.isiZulu_text}"

class Collocation(BaseModel):
    entry = models.ForeignKey(
        CulturalEntry, 
        on_delete=models.CASCADE, 
        related_name='collocations'
    )
    phrase = models.CharField(max_length=100)
    frequency = models.IntegerField(default=1)
    
    class Meta:
        db_table = 'collocations'
        unique_together = ['entry', 'phrase']
        ordering = ['-frequency']
    
    def __str__(self):
        return f"'{self.phrase}' for {self.entry.isiZulu_text}"

class ActivityLog(BaseModel):
    ACTION_CHOICES = [
        ('search', 'Search'),
        ('view', 'View'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('import', 'Import'),
        ('export', 'Export'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} by {self.user} at {self.created_at}"