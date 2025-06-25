import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiPropertyOptional({ description: 'The response data' })
  data?: T;

  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  message?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Validation error message'],
    description: 'Array of error messages',
  })
  errors?: string[];

  @ApiPropertyOptional({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      pages: 10,
    },
  })
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}
