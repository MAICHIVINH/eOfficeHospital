# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy from local build folder
# Note: Ensure you have run 'dotnet publish -c Release -o ./publish' locally first.
COPY ./publish .

# Install dependencies for Puppeteer (required for PDF generation)
RUN apt-get update && apt-get install -y \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnss3-dev \
    libxss-dev \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    libxdamage1 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxrandr2 \
    libpangocairo-1.0-0 \
    libxrender1 \
    libfontconfig1 \
    libdbus-1-3 \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 5020
ENV ASPNETCORE_URLS=http://+:5020
ENTRYPOINT ["dotnet", "QLVB.Api.dll"]
