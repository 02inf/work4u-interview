const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { insertDigest, getAllDigests, getDigestById } = require('../database');
const { generateMeetingDigest } = require('../services/aiService');

const router = express.Router();

/**
 * POST /api/digests
 * 创建新的会议摘要
 */
router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;

    // 验证输入
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({
        error: '无效的输入',
        message: '请提供有效的会议记录文本'
      });
    }

    if (transcript.length > 10000) {
      return res.status(400).json({
        error: '输入过长',
        message: '会议记录不能超过10000个字符'
      });
    }

    // 生成唯一ID
    const id = uuidv4();

    // 调用AI服务生成摘要
    console.log('开始生成AI摘要...');
    const summary = await generateMeetingDigest(transcript);
    console.log('AI摘要生成完成');

    // 保存到数据库
    const digest = await insertDigest(id, transcript, summary);

    res.status(201).json(digest);
  } catch (error) {
    console.error('创建摘要失败:', error);
    
    if (error.message.includes('Google AI API密钥未配置')) {
      return res.status(500).json({
        error: 'AI服务配置错误',
        message: '请检查Google AI API密钥配置'
      });
    }
    
    if (error.message.includes('AI摘要生成失败')) {
      return res.status(500).json({
        error: 'AI服务调用失败',
        message: 'AI服务暂时不可用，请稍后重试'
      });
    }

    res.status(500).json({
      error: '创建摘要失败',
      message: '服务器内部错误，请稍后重试'
    });
  }
});

/**
 * GET /api/digests
 * 获取所有摘要列表
 */
router.get('/', async (req, res) => {
  try {
    const digests = await getAllDigests();
    res.json(digests);
  } catch (error) {
    console.error('获取摘要列表失败:', error);
    res.status(500).json({
      error: '获取摘要列表失败',
      message: '服务器内部错误，请稍后重试'
    });
  }
});

/**
 * GET /api/digests/:id
 * 根据ID获取单个摘要
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID格式
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: '无效的ID',
        message: '请提供有效的摘要ID'
      });
    }

    const digest = await getDigestById(id);

    if (!digest) {
      return res.status(404).json({
        error: '摘要不存在',
        message: '未找到指定的摘要'
      });
    }

    res.json(digest);
  } catch (error) {
    console.error('获取摘要详情失败:', error);
    res.status(500).json({
      error: '获取摘要详情失败',
      message: '服务器内部错误，请稍后重试'
    });
  }
});

/**
 * DELETE /api/digests/:id
 * 删除指定摘要（可选功能）
 */
router.delete('/:id', async (req, res) => {
  try {
    // 这里可以添加删除逻辑
    res.status(501).json({
      error: '功能未实现',
      message: '删除功能暂未实现'
    });
  } catch (error) {
    console.error('删除摘要失败:', error);
    res.status(500).json({
      error: '删除摘要失败',
      message: '服务器内部错误，请稍后重试'
    });
  }
});

module.exports = router;
