from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_deck_description'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DeckParticipant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('total_study_seconds', models.IntegerField(default=0)),
                ('deck', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='api.deck')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='deck_participations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-joined_at'],
                'unique_together': {('user', 'deck')},
            },
        ),
    ]
