from django.contrib import admin
from .models import Users, Medications, Hba1c, Log


@admin.register(Users)
class Users_modification(admin.ModelAdmin):
    list_display = ('email', 'password')
    search_fields = ('email', )
    list_filter = ('email', )

admin.site.register(Medications)
admin.site.register(Hba1c)
admin.site.register(Log)