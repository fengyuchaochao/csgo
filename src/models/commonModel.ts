// 全局共享数据示例
const userIdList = ['U1107099955', 'U1106913112'];

export default function CommonModel() {
  const getBuffUserIdList = () => {
    return userIdList;
  };
  const getCurrentBuffUserId = () => {
    return localStorage.getItem('current_buff_user_id') || userIdList[0];
  };

  const setCurrentBuffUserId = (userId) => {
    localStorage.setItem('current_buff_user_id', userId || userIdList[0]);
  };

  const getCardRate = () => {
    return Number(localStorage.getItem('cardRate') || 6);
  };

  const setCardRate = (rate) => {
    localStorage.setItem('cardRate', rate);
  };

  return {
    getBuffUserIdList,
    getCurrentBuffUserId,
    setCurrentBuffUserId,
    getCardRate,
    setCardRate,
  };
}
