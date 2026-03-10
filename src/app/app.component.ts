import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Toast } from 'primeng/toast';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, SidebarComponent, CommonModule],
  template: `
    <p-toast position="top-right" />
    <div class="app-layout">
      <app-sidebar *ngIf="showSidebar"></app-sidebar>
      <main [class.main-content]="showSidebar" [class.full-content]="!showSidebar">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
    }
    .full-content {
      width: 100%;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {
  showSidebar = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.showSidebar = !e.urlAfterRedirects.includes('/auth');
      });
  }
}