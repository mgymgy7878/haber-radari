package com.haberradari

import android.app.Application
import com.haberradari.data.local.AppDatabase
import com.haberradari.data.repository.NewsRepository
import com.haberradari.sync.RssSyncWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Haber Radarı Application sınıfı.
 *
 * Uygulama başlatıldığında:
 * 1. Room veritabanını başlatır
 * 2. Varsayılan RSS kaynaklarını yükler (ilk çalıştırma)
 * 3. WorkManager periyodik sync'i zamanlar
 */
class HaberRadariApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var repository: NewsRepository
        private set

    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onCreate() {
        super.onCreate()

        // Veritabanı başlat
        database = AppDatabase.getInstance(this)

        // Repository oluştur
        repository = NewsRepository(
            articleDao = database.articleDao(),
            sourceDao = database.sourceDao(),
            feedHealthDao = database.feedHealthDao()
        )

        // Varsayılan kaynakları yükle (ilk çalıştırma)
        applicationScope.launch {
            repository.seedDefaultSources()
        }

        // Periyodik RSS sync zamanla
        RssSyncWorker.schedule(this)
    }
}
