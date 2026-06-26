package com.haberradari.sync

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.haberradari.data.local.AppDatabase
import com.haberradari.data.repository.NewsRepository
import java.util.concurrent.TimeUnit

/**
 * Periyodik RSS sync worker.
 *
 * WorkManager ile çalışır — cihaz yeniden başlasa da devam eder.
 * Yalnızca RSS metadata çeker; tam metin, scraping veya AI özet yoktur.
 *
 * Periyot: 30 dakika (WorkManager minimum 15 dakika)
 * Constraint: İnternet bağlantısı gerekli
 */
class RssSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            Log.d(TAG, "RSS sync başlıyor...")

            val database = AppDatabase.getInstance(applicationContext)
            val repository = NewsRepository(
                articleDao = database.articleDao(),
                sourceDao = database.sourceDao(),
                feedHealthDao = database.feedHealthDao()
            )

            val newCount = repository.refreshFeeds()
            Log.d(TAG, "RSS sync tamamlandı: $newCount yeni makale")

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "RSS sync hatası", e)
            if (runAttemptCount < MAX_RETRIES) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    companion object {
        private const val TAG = "RssSyncWorker"
        private const val WORK_NAME = "rss_periodic_sync"
        private const val MAX_RETRIES = 3

        /**
         * Periyodik RSS sync'i başlat.
         * Mevcut zamanlanmış iş varsa korur (KEEP policy).
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val request = PeriodicWorkRequestBuilder<RssSyncWorker>(
                repeatInterval = 30,
                repeatIntervalTimeUnit = TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .addTag(WORK_NAME)
                .build()

            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request
                )

            Log.d(TAG, "RSS sync zamanlandı: 30 dakika aralıkla")
        }

        /**
         * Periyodik sync'i iptal et.
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
            Log.d(TAG, "RSS sync iptal edildi")
        }
    }
}
