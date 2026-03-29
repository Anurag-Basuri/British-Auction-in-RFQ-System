export class CreateRfqDto {
  title!: string;
  description?: string;
  start_time!: string;
  close_time!: string;
  forced_close_time!: string;
  trigger_window_mins!: number;
  extension_mins!: number;
  trigger_type!: 'ANY_BID' | 'RANK_CHANGE' | 'L1_CHANGE';
}
