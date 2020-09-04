import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Components
import { AlertComponent } from './alert/alert.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { TranslateModule } from '@ngx-translate/core';
import { LoggingService } from '../logging.service';
import { DirectivesModule } from './directives/directives.module';

@NgModule({
  declarations: [
    AlertComponent,
    SearchBarComponent,
  ],
  imports: [
    DirectivesModule,
    CommonModule,
  ],
  exports: [
    AlertComponent,
    TranslateModule,
  ],
  providers: [LoggingService]
})
export class SharedModule { }
