web: gunicorn logistic_system.wsgi:application --log-file - --log-level info --bind 0.0.0.0:$PORT
worker: celery -A logistic_system worker --loglevel=info
beat: celery -A logistic_system beat --loglevel=info
