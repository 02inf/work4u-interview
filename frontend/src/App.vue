<template>
  <div id="app">
    <el-container>
      <el-header height="60px" style="background-color: #409EFF; color: white; display: flex; align-items: center;">
        <h2 style="margin: 0;">AI 会议摘要服务</h2>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>