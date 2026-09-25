from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.views import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import Medications, Hba1c, Log
from datetime import date, timedelta


def home(request):
    if not request.user.is_authenticated:
        return render(request, 'diabetics_space/index.html')

    log_reading = Log.objects.filter(user=request.user).order_by('-date', '-time').first()
    hba1c_reading = Hba1c.objects.filter(user=request.user).order_by('-test_date').first()

    if len(Log.objects.filter(user=request.user).order_by('-date', '-time')) < 4:
        recent_readings = Log.objects.filter(user=request.user).order_by('-date', '-time')
    else:
        recent_readings = Log.objects.filter(user=request.user).order_by('-date', '-time')[:4]

    range_days = int(request.GET.get('range', 30))
    graph_cutoff = date.today() - timedelta(days=range_days)
    graph_readings = Log.objects.filter(user=request.user, date__gte=graph_cutoff).order_by('date', 'time')

    avg_cutoff = date.today() - timedelta(days=30)
    window_readings = Log.objects.filter(user=request.user, date__gte=avg_cutoff).order_by('date', 'time')
    count = window_readings.count()
    average = round(sum(r.sugar for r in window_readings) / count, 0) if count else None

    return render(request, 'diabetics_space/index.html', {
        'reading': log_reading,
        'hba1c': hba1c_reading,
        'recent_reading': recent_readings,
        'graph_reading': graph_readings,
        'average_glucose_reading': average,
        'range_days': range_days,
    })


def medications(request):
    if request.method == 'POST':
        medication_name = request.POST.get('medication')
        dosage = request.POST.get('dosage')
        frequency = request.POST.get('frequency')
        started_on = request.POST.get('dates')
        times_of_day = request.POST.get('times')
        notes = request.POST.get('notes')
        Medications.objects.create(
            medication_name=medication_name,
            dosage=dosage,
            frequency=frequency,
            started_on=started_on,
            times_of_day=times_of_day,
            notes=notes,
            user=request.user
        )
        return redirect(to='medications')
    all_medications = Medications.objects.filter(user=request.user)
    return render(request, 'diabetics_space/medications.html', {'medications': all_medications})


def hba1c(request):
    if request.user.is_authenticated:
        if request.method == 'POST':
            test_date = request.POST.get('date')
            result = request.POST.get('result')
            notes = request.POST.get('notes')
            Hba1c.objects.create(
                test_date=test_date,
                result=result,
                notes=notes,
                user=request.user
            )
            return redirect(to='hba1c')
        all_results = Hba1c.objects.filter(user=request.user).order_by('-test_date')
        test_months = int(request.GET.get('months', 9))
        start_date = date.today() - timedelta(days=(test_months * 30))
        readings = Hba1c.objects.filter(user=request.user, test_date__gte=start_date).order_by('-test_date')
        current_result = Hba1c.objects.filter(user=request.user).order_by('-test_date').first()
        if current_result:
            result = current_result.result
        else:
            result = None

        return render(request, 'diabetics_space/hba1c.html', {'hba1c': readings,
                                                              'current_result': result,
                                                              'months': test_months,
                                                              'readings': readings,
                                                              'all_results': all_results}
                      )
    else:
        return render(request, 'diabetics_space/hba1c.html')


def guidance(request):
    return render(request, 'diabetics_space/guidance.html')


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
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return redirect(to='home_page')
    else:
        form = CustomUserCreationForm()
    return render(request, 'diabetics_space/register.html', {'form': form})


def login_user(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user(), backend='django.contrib.auth.backends.ModelBackend')
            return redirect(to='home_page')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'diabetics_space/login.html', {'form': form})


@login_required()
def logout_user(request):
    logout(request)
    return redirect(to='home_page')


def delete_medications(request, id):
    selected_data = Medications.objects.filter(id=id)
    selected_data.delete()
    return redirect(to='medications')


def delete_hba1c(request, id):
    selected_data = Hba1c.objects.filter(id=id)
    selected_data.delete()
    return redirect(to='hba1c')


def delete_log(request, id):
    selected_data = Log.objects.filter(id=id)
    selected_data.delete()
    return redirect(to='log')


def update_medications(request, id):
    if request.method == 'POST':
        medication_name = request.POST.get('medication')
        dosage = request.POST.get('dosage')
        frequency = request.POST.get('frequency')
        started_on = request.POST.get('dates')
        times_of_day = request.POST.get('times')
        notes = request.POST.get('notes')
        selected_data = Medications.objects.get(id=id)
        selected_data.medication_name = medication_name
        selected_data.dosage = dosage
        selected_data.frequency = frequency
        selected_data.started_on = started_on
        selected_data.times_of_day = times_of_day
        selected_data.notes = notes
        selected_data.save()
        return redirect(to='medications')
    selected_data = Medications.objects.get(id=id)
    medication_name = selected_data.medication_name
    dosage = selected_data.dosage
    frequency = selected_data.frequency
    started_on = selected_data.started_on
    times_of_day = selected_data.times_of_day
    notes = selected_data.notes
    return render(request, 'diabetics_space/medications.html', {'name': medication_name,
                                                                'dosage': dosage, 'frequency': frequency,
                                                                'started_on': started_on,
                                                                'times': times_of_day, 'notes': notes,
                                                                'mode': 'update'})


def update_hba1c(request, id):
    if request.method == 'POST':
        selected_data = Hba1c.objects.get(id=id)
        test_date = request.POST.get('date')
        result = request.POST.get('result')
        notes = request.POST.get('notes')
        selected_data.test_date = test_date
        selected_data.result = result
        selected_data.notes = notes
        selected_data.save()
        return redirect(to='hba1c')

    selected_data = Hba1c.objects.get(id=id)
    test_date = selected_data.test_date
    result = selected_data.result
    notes = selected_data.notes
    return render(request, 'diabetics_space/hba1c.html', {'date': test_date,
                                                          'result': result,
                                                          'notes': notes,
                                                          'mode': 'update'})


def update_log(request, id):
    if request.method == "POST":
        date = request.POST.get('date')
        time = request.POST.get('time')
        sugar = request.POST.get('sugar')
        taken_on = request.POST.get('type')
        notes = request.POST.get('notes')
        selected_data = Log.objects.get(id=id)
        selected_data.date = date
        selected_data.time = time
        selected_data.sugar = sugar
        selected_data.taken_on = taken_on
        selected_data.notes = notes
        selected_data.save()
        return redirect(to='log')
    selected_data = Log.objects.get(id=id)
    date = selected_data.date
    time = selected_data.time
    sugar = selected_data.sugar
    taken_on = selected_data.taken_on
    notes = selected_data.notes
    return render(request, 'diabetics_space/log.html', {'date': date,
                                                        'time': time,
                                                        'sugar': sugar,
                                                        'taken_on': taken_on,
                                                        'notes': notes,
                                                        'mode': 'update'})
