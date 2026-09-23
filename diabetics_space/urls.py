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
    path('logout', views.logout_user, name='logout'),
    path('delete_medication/<int:id>', views.delete_medications, name='delete_medications'),
    path('delete_hba1c/<int:id>', views.delete_hba1c, name='delete_hba1c'),
    path('delete_log/<int:id>', views.delete_log, name="delete_log"),
    path('update_medications/<int:id>', views.update_medications, name='update_medications'),
    path('update_hba1c/<int:id>', views.update_hba1c, name='update_hba1c')
]