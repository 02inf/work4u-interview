#!/bin/bash

# 获取 PNPM_HOME
PNPM_HOME_DEFAULT="/c/Users/$(whoami)/AppData/Local/pnpm"

echo "🔧 修复 pnpm 全局路径配置..."
echo "📌 设置 PNPM_HOME 为: $PNPM_HOME_DEFAULT"

# 检查 ~/.bashrc 是否已包含 PNPM_HOME
if grep -q "PNPM_HOME" ~/.bashrc; then
    echo "✅ ~/.bashrc 已包含 PNPM_HOME，无需重复添加。"
else
    echo -e "\n# PNPM 设置" >> ~/.bashrc
    echo "export PNPM_HOME=\"$PNPM_HOME_DEFAULT\"" >> ~/.bashrc
    echo "export PATH=\"\$PNPM_HOME:\$PATH\"" >> ~/.bashrc
    echo "✅ 已将 PNPM_HOME 添加到 ~/.bashrc"
fi

# 设置 pnpm 的 global-bin-dir
pnpm config set global-bin-dir "$PNPM_HOME_DEFAULT"

# 立即导入环境变量（无需重启）
export PNPM_HOME="$PNPM_HOME_DEFAULT"
export PATH="$PNPM_HOME:$PATH"

# 验证结果
echo "📂 当前 PNPM_HOME: $PNPM_HOME"
echo "🔎 当前 PATH 包含 PNPM_HOME 吗？"
echo "$PATH" | grep "$PNPM_HOME" && echo "✅ 包含" || echo "❌ 不包含"

# 检查 pnpm 命令是否正常
if command -v pnpm &> /dev/null; then
    echo "🚀 pnpm 命令可用，版本为：$(pnpm -v)"
else
    echo "❌ pnpm 命令仍不可用，请检查环境变量配置。"
fi

echo "🎉 完成！可以重新运行：pnpm install -g @anthropic-ai/claude-code"
