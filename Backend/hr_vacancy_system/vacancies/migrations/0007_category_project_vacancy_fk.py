from django.db import migrations, models
import django.db.models.deletion


def create_categories_from_old_field(apps, schema_editor):
    """Migrate old category CharField values into Category objects."""
    Category = apps.get_model('vacancies', 'Category')
    Vacancy = apps.get_model('vacancies', 'Vacancy')

    label_map = {
        'software': 'Software Development',
        'project_management': 'Project Management',
        'data': 'Data & Analytics',
        'design': 'Design & UX',
        'marketing': 'Marketing',
        'sales': 'Sales',
        'hr': 'Human Resources',
        'finance': 'Finance & Accounting',
        'operations': 'Operations',
        'customer_service': 'Customer Service',
        'engineering': 'Engineering',
        'other': 'Other',
    }

    for vacancy in Vacancy.objects.all():
        old_val = vacancy.category_old or 'other'
        display = label_map.get(old_val, old_val.replace('_', ' ').title())
        cat, _ = Category.objects.get_or_create(name=display)
        vacancy.category = cat
        vacancy.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0006_vacancy_department_fk'),
        ('accounts', '0004_user_department_fk'),
    ]

    operations = [
        # 1. Create Category model
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['name'], 'verbose_name_plural': 'categories'},
        ),
        # 2. Create Project model
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('department', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='projects',
                    to='accounts.department',
                )),
            ],
            options={'ordering': ['name']},
        ),
        # 3. Rename old category CharField so we can reuse the name
        migrations.RenameField(
            model_name='vacancy',
            old_name='category',
            new_name='category_old',
        ),
        # 4. Add new category FK (nullable)
        migrations.AddField(
            model_name='vacancy',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='vacancies',
                to='vacancies.category',
            ),
        ),
        # 5. Add project FK
        migrations.AddField(
            model_name='vacancy',
            name='project',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='vacancies',
                to='vacancies.project',
            ),
        ),
        # 6. Migrate old string values to Category objects
        migrations.RunPython(create_categories_from_old_field, migrations.RunPython.noop),
        # 7. Remove old category CharField
        migrations.RemoveField(
            model_name='vacancy',
            name='category_old',
        ),
    ]
