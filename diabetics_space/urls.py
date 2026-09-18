from django.urls import path
from . import views


urlpatterns = [
    path('', views.home, name='home_page'),
    path('medications', views.medications, name='medications'),
    path('hba1c', views.hba1c, name='hba1c'),
    path('guidance', views.guidance, name='guidance'),
    path('log', views.log, name='log'),
    path('login', views.login_user, name='login'),
    path('register', views.register, name='register'),
    path('logout', views.logout_user, name='logout')
]