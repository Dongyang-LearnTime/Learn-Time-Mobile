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

  if (error.response.status >= 500) {
    return '서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';
  }

  const serverMessage = error.response.data?.message ?? error.response.data?.error;
  return typeof serverMessage === 'string' && serverMessage.length <= 200
    ? serverMessage
    : `요청에 실패했습니다. (${error.response.status})`;
}
