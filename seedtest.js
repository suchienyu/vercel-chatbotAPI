const axios = require('axios');

const questions = [
  {
    message: "what is your name?",
    response: "Momo"
  },
  
];

// 向 API 发送请求添加假数据
async function seedData() {
  try {
    for (const question of questions) {
      const response = await axios.post('http://localhost:3002/api/add-question', question);
      console.log(`Added question: ${question.message}`);
      console.log('API response:', response.data);
    }
    console.log('Data seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seedData();