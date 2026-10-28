import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',      // Altera para o nome exato do ficheiro html na pasta
  styleUrl: './home.css'           // Altera para o nome exato do ficheiro css na pasta
})
export class Home {}