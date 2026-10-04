import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'coach.karim@gmail.com',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Mot de passe',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
