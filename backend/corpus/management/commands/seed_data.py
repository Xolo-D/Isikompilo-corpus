# corpus/management/commands/seed_data.py
import json
from django.core.management.base import BaseCommand
from corpus.models import CulturalEntry, UsageExample, AdditionalTranslation
from corpus.services import DataImportService

class Command(BaseCommand):
    help = 'Seed the database with initial isiZulu cultural data'
    
    def handle(self, *args, **options):
        initial_data = [
            {
                "isiZulu_text": "Ubuntu",
                "english_translation": "Humanity, human kindness",
                "part_of_speech": "noun",
                "genre": "cultural",
                "cultural_context": "Philosophical concept emphasizing shared humanity and interconnectedness",
                "source": "Traditional philosophy",
                "examples": [
                    {
                        "isizulu": "Ubuntu ngumuntu ngabantu",
                        "english": "A person is a person through other people"
                    }
                ],
                "additional_translations": {
                    "isixhosa": "Ubuntu",
                    "sesotho": "Botho"
                }
            },
            {
                "isiZulu_text": "Indlela ibuzwa kwabaphambili",
                "english_translation": "The way is asked from those who have gone before",
                "part_of_speech": "proverb",
                "genre": "proverb", 
                "cultural_context": "Emphasizes learning from elders and experienced people",
                "source": "Traditional proverb",
                "examples": [
                    {
                        "isizulu": "Umuntu omusha kufanele azwe izinkulumo zabadala",
                        "english": "A young person should listen to the elders' wisdom"
                    }
                ]
            }
        ]
        
        try:
            imported_count = DataImportService.import_from_json(initial_data)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully seeded {imported_count} entries')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error seeding data: {str(e)}')
            )