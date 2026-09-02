import axios from 'axios';

type ErrorBody = {
  message?: string;
  error?: string;
};

export function getApiError(error: unknown): string {
  if (!axios.isAxiosError<ErrorBody>(error)) {
    return '알 수 없는 오류가 발생했습니다.';
  }

  if (!error.response) {
    return '서버에 연결할 수 없습니다. 네트워크와 서버 주소를 확인해주세요.';
  }

  return error.response.data?.message
    ?? error.response.data?.error
    ?? `요청에 실패했습니다. (${error.response.status})`;
}
