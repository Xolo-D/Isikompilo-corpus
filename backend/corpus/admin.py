# corpus/admin.py
from django.contrib import admin
from .models import CulturalEntry, UsageExample, AdditionalTranslation, Collocation, ActivityLog

@admin.register(CulturalEntry)
class CulturalEntryAdmin(admin.ModelAdmin):
    list_display = ['isiZulu_text', 'english_translation', 'part_of_speech', 'genre', 'frequency', 'is_active']
    list_filter = ['part_of_speech', 'genre', 'is_active']
    search_fields = ['isiZulu_text', 'english_translation']
    readonly_fields = ['frequency', 'created_at', 'updated_at']
    fieldsets = [
        ('Content', {
            'fields': ['isiZulu_text', 'english_translation']
        }),
        ('Metadata', {
            'fields': ['part_of_speech', 'genre', 'cultural_context', 'source']
        }),
        ('Statistics', {
            'fields': ['frequency', 'is_active']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]

@admin.register(UsageExample)
class UsageExampleAdmin(admin.ModelAdmin):
    list_display = ['entry', 'isiZulu_example']
    list_filter = ['entry__part_of_speech']
    search_fields = ['isiZulu_example', 'english_example']

@admin.register(AdditionalTranslation)
class AdditionalTranslationAdmin(admin.ModelAdmin):
    list_display = ['entry', 'language', 'translation']
    list_filter = ['language']
    search_fields = ['translation']

@admin.register(Collocation)
class CollocationAdmin(admin.ModelAdmin):
    list_display = ['entry', 'phrase', 'frequency']
    list_filter = ['entry__genre']
    search_fields = ['phrase']

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'description', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__username', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'