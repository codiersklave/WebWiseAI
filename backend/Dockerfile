# Use the official Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Install gunicorn
RUN pip install gunicorn

# Expose port 5000
EXPOSE 5000

# Use gunicorn to run the app
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "wsgi:app"]
