import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  activeTab: string | number = '0';
  constructor(private router: Router) {}
  goToRegister() { this.activeTab = '1'; }
  goToLogin()    { this.activeTab = '0'; }
  onLoginSuccess() { this.router.navigate(['/home']); }
}