# corpus/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'entries', views.CulturalEntryViewSet, basename='culturalentry')

urlpatterns = [
    path('', include(router.urls)),
]