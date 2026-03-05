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

# Composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./

RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

# Remove .env so Railway env vars are used instead of local defaults
RUN rm -f .env

RUN mkdir -p storage/logs storage/framework/sessions storage/framework/views storage/framework/cache/data bootstrap/cache \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Nginx configuration
COPY docker/nginx/railway.conf /etc/nginx/sites-available/default
RUN rm -f /etc/nginx/sites-enabled/default && \
    ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Supervisor configuration
COPY docker/supervisor/railway.conf /etc/supervisor/conf.d/supervisord.conf
RUN mkdir -p /var/log/supervisor

EXPOSE 8080

CMD ["sh", "-c", "\
sed -i \"s/listen 8080/listen ${PORT:-8080}/\" /etc/nginx/sites-available/default && \
mkdir -p storage/logs storage/framework/sessions storage/framework/views storage/framework/cache/data && \
chown -R www-data:www-data storage bootstrap/cache || true && \
chmod -R 775 storage bootstrap/cache || true && \
chmod 600 storage/oauth-private.key storage/oauth-public.key 2>/dev/null || true && \
php artisan storage:link 2>/dev/null || true && \
php artisan migrate --force 2>/dev/null || true && \
/usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf \
"]
