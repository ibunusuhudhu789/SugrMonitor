from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import Medications, Hba1c, Log

def home(request):
    log_reading = Log.objects.filter(user=request.user).order_by('-date', '-time').first()
    hba1c_reading = Hba1c.objects.filter(user=request.user).order_by('-test_date').first()
    recent_readings = Log.objects.filter(user=request.user).order_by('-date', '-time')
    all_readings = 0
    all_readings_list = []
    count = 0
    for reading in recent_readings:
        if count <= 30:
            all_readings += reading.sugar
        all_readings_list.append(reading.sugar)
        count += 1
    average = all_readings/count
    return render(request, 'diabetics_space/index.html', {'reading':log_reading, 'hba1c':hba1c_reading, 'recent_reading':recent_readings, 'average_glucose_reading':average, 'all_reading_list':all_readings_list})


@login_required()
def medications(request):
    if request.method == 'POST':
        medication_name = request.POST.get('medication')
        dosage = request.POST.get('dosage')
        frequency = request.POST.get('frequency')
        started_on = request.POST.get('dates')
        times_of_day = request.POST.get('times')
        notes = request.POST.get('notes')
        Medications.objects.create(
            medication_name = medication_name,
            dosage = dosage,
            frequency = frequency,
            started_on = started_on,
            times_of_day = times_of_day,
            notes = notes,
            user = request.user
        )
        return redirect(to='home_page')
    all_medications = Medications.objects.filter(user=request.user)
    return render(request, 'diabetics_space/medications.html', {'medications': all_medications})


@login_required()
def hba1c(request):
    if request.method == 'POST':
        test_date = request.POST.get('date')
        result = request.POST.get('result')
        notes = request.POST.get('notes')
        Hba1c.objects.create(
            test_date = test_date,
            result = result,
            notes = notes
        )
        return redirect(to='hba1c')
    hba1c_data = Hba1c.objects.filter(user=request.user)
    return render(request, 'diabetics_space/hba1c.html', {'hba1c': hba1c_data})


def guidance(request):
    return render(request, 'diabetics_space/guidance.html')


@login_required()
def log(request):
    if request.method == 'POST':
        date = request.POST.get('date')
        time = request.POST.get('time')
        sugar = request.POST.get('sugar')
        taken_on = request.POST.get('type')
        notes = request.POST.get('notes')
        Log.objects.create(
            date=date,
            time=time,
            sugar=sugar,
            taken_on=taken_on,
            notes=notes,
            user=request.user
        )
        return redirect(to='log')

    filter_type = request.GET.get('type', 'all')
    log_reading = Log.objects.filter(user=request.user)
    if filter_type != 'all':
        log_reading = log_reading.filter(taken_on=filter_type)
    log_reading = log_reading.order_by('-date', '-time')

    return render(request, 'diabetics_space/log.html', {
        'reading': log_reading,
        'filter_type': filter_type,
    })

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
           user = form.save()
           login(request, user)
           return redirect(to='home_page')
    else:
        form = CustomUserCreationForm()
    return render(request, 'diabetics_space/register.html', {'form': form})


def login_user(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect(to='home_page')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'diabetics_space/login.html', {'form': form})


@login_required()
def logout_user(request):
    logout(request)
    return redirect(to='home_page')