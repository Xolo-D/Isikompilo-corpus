# corpus/serializers.py
from rest_framework import serializers
from .models import CulturalEntry, UsageExample, AdditionalTranslation, Collocation

class UsageExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageExample
        fields = ['id', 'isiZulu_example', 'english_example']
        read_only_fields = ['id']

class AdditionalTranslationSerializer(serializers.ModelSerializer):
    language_display = serializers.CharField(source='get_language_display', read_only=True)
    
    class Meta:
        model = AdditionalTranslation
        fields = ['id', 'language', 'language_display', 'translation']
        read_only_fields = ['id']

class CollocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collocation
        fields = ['id', 'phrase', 'frequency']
        read_only_fields = ['id']

class CulturalEntrySerializer(serializers.ModelSerializer):
    examples = UsageExampleSerializer(many=True, required=False)
    additional_translations = AdditionalTranslationSerializer(many=True, required=False)
    collocations = CollocationSerializer(many=True, read_only=True)
    
    part_of_speech_display = serializers.CharField(
        source='get_part_of_speech_display', 
        read_only=True
    )
    genre_display = serializers.CharField(
        source='get_genre_display', 
        read_only=True
    )
    
    class Meta:
        model = CulturalEntry
        fields = [
            'id', 'isiZulu_text', 'english_translation', 
            'part_of_speech', 'part_of_speech_display',
            'genre', 'genre_display', 'cultural_context', 
            'source', 'frequency', 'is_active',
            'examples', 'additional_translations', 'collocations',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'frequency', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        examples_data = validated_data.pop('examples', [])
        translations_data = validated_data.pop('additional_translations', [])
        
        entry = CulturalEntry.objects.create(**validated_data)
        
        # Create nested examples
        for example_data in examples_data:
            UsageExample.objects.create(entry=entry, **example_data)
        
        # Create nested translations
        for translation_data in translations_data:
            AdditionalTranslation.objects.create(entry=entry, **translation_data)
        
        return entry
    
    def update(self, instance, validated_data):
        examples_data = validated_data.pop('examples', None)
        translations_data = validated_data.pop('additional_translations', None)
        
        # Update main entry
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update examples if provided
        if examples_data is not None:
            instance.examples.all().delete()
            for example_data in examples_data:
                UsageExample.objects.create(entry=instance, **example_data)
        
        # Update translations if provided
        if translations_data is not None:
            instance.additional_translations.all().delete()
            for translation_data in translations_data:
                AdditionalTranslation.objects.create(entry=instance, **translation_data)
        
        return instance

class CulturalEntryListSerializer(serializers.ModelSerializer):
    part_of_speech_display = serializers.CharField(
        source='get_part_of_speech_display', 
        read_only=True
    )
    
    class Meta:
        model = CulturalEntry
        fields = [
            'id', 'isiZulu_text', 'english_translation',
            'part_of_speech', 'part_of_speech_display', 'genre',
            'frequency', 'created_at'
        ]