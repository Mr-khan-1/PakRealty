import mongoose from 'mongoose';

/**
 * ScrapeLog schema – records each execution of the property scraper.
 * Fields:
 *   - startedAt: Date when the scraper started.
 *   - finishedAt: Date when the scraper completed (null if still running).
 *   - status: 'running' | 'completed' | 'failed'.
 *   - processedCount: Number of properties processed.
 *   - newCount: Number of newly inserted properties.
 *   - updatedCount: Number of existing properties updated.
 *   - errorMessage: Optional error details when status is 'failed'.
 */
const ScrapeLogSchema = new mongoose.Schema(
  {
    startedAt:     { type: Date, default: Date.now, required: true },
    finishedAt:    { type: Date },
    status:        { type: String, enum: ['running', 'completed', 'failed'], required: true },
    processedCount:{ type: Number, default: 0 },
    newCount:     { type: Number, default: 0 },
    updatedCount:  { type: Number, default: 0 },
    errorMessage:  { type: String },
  },
  { timestamps: true }
);

// Index to quickly fetch the latest run and to avoid duplicate logs for the same start time.
ScrapeLogSchema.index({ startedAt: -1 });

export default mongoose.models.ScrapeLog || mongoose.model('ScrapeLog', ScrapeLogSchema);
