FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY vendor /usr/share/nginx/html/vendor
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
