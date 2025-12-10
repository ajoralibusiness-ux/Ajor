import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AudioRecorderComponent]
})
export class AppComponent {}
