import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
    id("org.jetbrains.kotlin.plugin.compose") version "2.2.10"
}

fun gitShortSha(): String = runCatching {
    ProcessBuilder("git", "rev-parse", "--short", "HEAD")
        .directory(rootProject.projectDir.parentFile.parentFile)
        .redirectErrorStream(true)
        .start()
        .inputStream.bufferedReader()
        .readText()
        .trim()
}.getOrDefault("unknown").ifEmpty { "unknown" }

val buildTimestamp: String = DateTimeFormatter.ofPattern("yyyyMMdd-HHmm")
    .withZone(ZoneId.systemDefault())
    .format(Instant.now())

android {
    namespace = "com.haberradari"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.haberradari"
        minSdk = 26
        targetSdk = 35
        versionCode = 67
        versionName = "0.6.7-debug"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        buildConfigField("String", "GIT_SHA", "\"${gitShortSha()}\"")
        buildConfigField("String", "BUILD_TIME", "\"$buildTimestamp\"")
    }

    buildTypes {
        debug {
            buildConfigField("String", "SMART_FEED_BASE_URL", "\"http://127.0.0.1:3001\"")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Prod HTTPS URL: Gradle -PprodSmartFeedBaseUrl=https://api.example.com ile verilir.
            val prodUrl = (project.findProperty("prodSmartFeedBaseUrl") as String?)?.trim().orEmpty()
            val escapedProdUrl = prodUrl.replace("\\", "\\\\").replace("\"", "\\\"")
            buildConfigField("String", "SMART_FEED_BASE_URL", "\"$escapedProdUrl\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }
}

dependencies {
    // Compose BOM — single version management
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // Room — offline-first SQLite cache
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // WorkManager — periodic RSS sync
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    // DataStore — user preferences
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // Ktor — HTTP client for RSS fetch
    val ktorVersion = "3.0.3"
    implementation("io.ktor:ktor-client-android:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")

    // Core
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.browser:browser:1.8.0") // Custom Tabs for article links

    // Remote Feed Networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")

    // Test
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlin:kotlin-test:2.1.0")
    testImplementation("org.jetbrains.kotlin:kotlin-reflect:2.1.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
    testImplementation("io.mockk:mockk:1.13.13")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
}
