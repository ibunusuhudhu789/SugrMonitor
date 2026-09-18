from django.db import models
from django.contrib.auth.models import User


class Users(models.Model):
    email = models.CharField(max_length=100)
    password = models.CharField(max_length=100)


class Medications(models.Model):
    medication_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    started_on = models.DateField()
    times_of_day = models.CharField(max_length=100)
    notes = models.CharField(max_length=500, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medications')

    def __str__(self):
        return self.medication_name


class Hba1c(models.Model):
    test_date = models.DateField()
    result = models.FloatField()
    notes = models.CharField(max_length=500)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hba1c')


class Log(models.Model):
    date = models.DateField()
    time = models.TimeField()
    taken_on = models.CharField(max_length=50)
    sugar = models.IntegerField()
    notes = models.CharField(max_length=500, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='log')