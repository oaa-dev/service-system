FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libjpeg62-turbo-dev libwebp-dev libfreetype6-dev \
    libonig-dev libxml2-dev \
    libzip-dev libicu-dev libmagickwand-dev \
    libssl-dev librabbitmq-dev \
    nginx \
    supervisor \
    && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl zip sockets \
    && rm -rf /var/lib/apt/lists/*

RUN pecl install amqp redis \
    && docker-php-ext-enable amqp redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN rm -f .env

RUN mkdir -p storage/logs storage/framework/sessions storage/framework/views storage/framework/cache/data bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Nginx — remove default, use our config
RUN rm -f /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*
COPY docker/nginx/railway.conf /etc/nginx/conf.d/default.conf

# Supervisor
COPY docker/supervisor/railway.conf /etc/supervisor/conf.d/supervisord.conf
RUN mkdir -p /var/log/supervisor

CMD sh -c "\
mkdir -p storage/logs storage/framework/sessions storage/framework/views storage/framework/cache/data && \
chown -R www-data:www-data storage bootstrap/cache || true && \
chmod -R 775 storage bootstrap/cache || true && \
php artisan passport:keys --force 2>/dev/null || true && \
chmod 600 storage/oauth-private.key storage/oauth-public.key 2>/dev/null || true && \
chown www-data:www-data storage/oauth-private.key storage/oauth-public.key 2>/dev/null || true && \
php artisan storage:link 2>/dev/null || true && \
php artisan migrate --force 2>/dev/null || true && \
php artisan config:show database 2>&1 || true && \
php artisan route:list --path=api/v1 2>&1 | head -20 || true && \
php -r \"try { new PDO('mysql:host='.env('DB_HOST').';port='.env('DB_PORT').';dbname='.env('DB_DATABASE'), env('DB_USERNAME'), env('DB_PASSWORD')); echo 'DB OK'; } catch(Exception \\\$e) { echo 'DB FAIL: '.\\\$e->getMessage(); }\" 2>&1 || true && \
echo '--- ENV CHECK ---' && \
echo \"APP_KEY=\${APP_KEY:-NOT SET}\" && \
echo \"APP_ENV=\${APP_ENV:-NOT SET}\" && \
echo \"DB_HOST=\${DB_HOST:-NOT SET}\" && \
echo \"DB_DATABASE=\${DB_DATABASE:-NOT SET}\" && \
echo '--- END ENV CHECK ---' && \
ln -sf /dev/stderr storage/logs/laravel.log && \
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf \
"
