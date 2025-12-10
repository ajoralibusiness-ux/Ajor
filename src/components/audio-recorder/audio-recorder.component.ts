import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioRecorderComponent {
  isRecording = signal(false);
  isProcessing = signal(false);
  transcription = signal<string | null>(null);
  error = signal<string | null>(null);

  private geminiService = inject(GeminiService);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async toggleRecording(): Promise<void> {
    this.error.set(null);
    this.transcription.set(null);

    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        this.isProcessing.set(true);
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];

        try {
          const base64Audio = await this.convertBlobToBase64(audioBlob);
          const result = await this.geminiService.transcribeAudio(base64Audio, 'audio/webm');
          this.transcription.set(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            this.error.set(`Error during transcription: ${errorMessage}`);
        } finally {
            this.isProcessing.set(false);
        }
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
    } catch (err) {
      this.isRecording.set(false);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      this.error.set(`Could not start recording: ${errorMessage}. Please grant microphone permissions.`);
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      // Stop all media tracks to turn off the microphone indicator
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  getButtonText(): string {
    if (this.isRecording()) {
        return 'Stop Recording';
    }
    if (this.isProcessing()) {
        return 'Processing...';
    }
    return 'Start Recording';
  }
}
