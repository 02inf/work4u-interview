<template>
  <div id="app">
    <header class="header">
      <h1>AI会议摘要</h1>
      <p>智能分析会议记录，生成结构化摘要</p>
    </header>
    
    <main class="main">
      <router-view />
    </main>
    
    <footer class="footer">
      <p>&copy; 2024 AI会议摘要服务</p>
    </footer>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  min-height: 70vh;
}

.footer {
  text-align: center;
  padding: 2rem;
  margin-top: 3rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
}
</style>
