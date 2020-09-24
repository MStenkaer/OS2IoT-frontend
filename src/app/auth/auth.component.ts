import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  public errorMessage: string;
  public errorMessages: any;
  public errorFields: string[];
  public formFailedSubmit = false;
  isLoginMode = true;
  isLoading = false;
  error: string = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    public translate: TranslateService,) { }

  ngOnInit(): void { }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  success() {
    this.isLoading = false;
    this.router.navigateByUrl('/dashboard');
  }

  fail() {
    this.isLoading = false;
    this.errorFields = ['username', 'password'];
    this.errorMessages = ['Login failed. Wrong username or password.'];
    this.formFailedSubmit = true;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const username = form.value.username;
    const password = form.value.password;

    this.isLoading = true;
    this.authService.login(username, password).subscribe(
      (x: any) => {
        console.log(x);
        if (x.accessToken) {
          this.success();
        } else {
          this.fail();
        }
      },
      (err) => {
        console.log(err);
      }
    );
  }
}
