from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'message': 'isiZulu Cultural Corpus API',
        'endpoints': {
            'corpus': '/api/corpus/',
            'search': '/api/search/',
            'analytics': '/api/analytics/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/corpus/', include('corpus.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/auth/', include('rest_framework.urls')),
]