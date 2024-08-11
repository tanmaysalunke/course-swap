# Start with the official Nginx image
FROM nginx:alpine

# Remove the default server definition
RUN rm /etc/nginx/conf.d/default.conf

# Copy the Nginx configuration file
COPY default.conf /etc/nginx/conf.d/default.conf

# Expose port for HTTP
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]