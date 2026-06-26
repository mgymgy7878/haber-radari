# Build Environment Status: BLOCKED_BY_LOCAL_TOOLCHAIN

## 1. Mevcut Durum

Şu an Legal-Safe RSS Core v0 statik olarak tamamlandı; kod tarafındaki guardrail kontrolleri (tam metin engeli, attribution vb.) iyi görünüyor. Ancak build/test aşamasına geçilemedi.

* **Status**: `BLOCKED_BY_LOCAL_TOOLCHAIN`
* **Java/JDK**: Bulunamadı (`java` / `javac` / `JAVA_HOME`).
* **Android SDK**: Bulunamadı (`ANDROID_HOME` / `ANDROID_SDK_ROOT` / `LOCALAPPDATA\Android\Sdk`).
* **Gradle Wrapper**: Eksik. Mevcut dosyalar arasında şunlar eksiktir:
  * `gradlew.bat`
  * `gradlew`
  * `gradle/wrapper/gradle-wrapper.jar`

---

## 2. Gerekli Kurulumlar

Android projesinin derlenebilmesi için geliştirme makinesinde asgari şu araçların kurulu olması zorunludur:

* **JDK**: Android Gradle Plugin sürümüyle uyumlu JDK (önerilen: JDK 17). `JAVA_HOME` ortam değişkeni ayarlanmalıdır.
* **Android SDK**:
  * Android SDK Platform
  * Android SDK Build-Tools
  * Android SDK Command-line Tools
  * `ANDROID_HOME` veya `ANDROID_SDK_ROOT` ortam değişkeni ayarlanmalıdır.
* **Gradle Wrapper**: Wrapper dosyaları (jar ve executable'lar) güvenilir bir Gradle veya Android Studio ortamında sıfırdan oluşturulmalı/eklenmelidir. Sadece `gradle-wrapper.properties` yeterli değildir.

> **Öneri:** En temiz yol **Android Studio** kurmaktır. Kurulum esnasında gerekli SDK, Build-Tools, Command-line Tools ve Emulator yapılandırmaları otomatik halledilir. Android Studio projeyi açtığında Gradle wrapper dosyalarını da otomatik indirebilir.

---

## 3. Doğrulama Komutları

Gerekli kurulumları yaptıktan sonra ortamı doğrulamak için (Windows PowerShell):

```powershell
# Java Kontrolü
java -version
javac -version
where.exe java
echo $env:JAVA_HOME

# Android SDK Kontrolü
echo $env:ANDROID_HOME
echo $env:ANDROID_SDK_ROOT
Test-Path "$env:LOCALAPPDATA\Android\Sdk"

# Gradle Wrapper Kontrolü
.\gradlew.bat --version
.\gradlew.bat :app:assembleDebug --stacktrace
.\gradlew.bat :app:testDebugUnitTest --stacktrace
```

---

## 4. Build Geçince Çalıştırılacak Acceptance

Yukarıdaki toolchain hazırlandıktan ve derleme başarılı olduktan sonra "Legal-Safe RSS Core v0 tamamlandı" diyebilmek için şu acceptance (geçit) doğrulamaları yapılmalıdır:

1. `:app:assembleDebug` başarılı olmalı.
2. `:app:testDebugUnitTest` başarılı olmalı.
3. Production `forbidden field` araması (tam metin/html değişkeni içermediği teyidi).
4. `secret search` (API Key vs. hardcoded olmadığı teyidi).
5. `legalMode tests` kapsamı (TITLE_LINK_ONLY null description ve DISABLED davranışı teyidi).
6. WorkManager metadata-only review (scraping içermediği teyidi).
7. UI source/link attribution review (kartta kaynak ve link zorunluluğu).

> **Not:** Build/test geçmeden Legal-Safe RSS Core v0 tamamlandı sayılmaz. Statik gate olumlu olsa bile Android/Kotlin/Room/Compose doğrulaması gerçek build ile yapılmalıdır.
