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

    lateinit var aiReaderRepository: com.haberradari.data.repository.AiReaderRepository
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
            feedHealthDao = database.feedHealthDao(),
            defaultSeedLoader = {
                com.haberradari.data.registry.AndroidSeedRegistryDeriver.deriveDefaultSeeds(this)
            },
        )

        aiReaderRepository = com.haberradari.data.repository.MockAiReaderRepository()

        // Varsayılan kaynakları yükle (ilk çalıştırma)
        applicationScope.launch {
            repository.seedDefaultSources()
        }

        // Periyodik RSS sync zamanla
        RssSyncWorker.schedule(this)
    }
}
