import { Grid, GridItem, Container, Text, Textarea, Box, Button, Table, Dialog, CloseButton, Portal } from "@chakra-ui/react"
import { Prose } from "@/components/ui/prose"
import {
    createFileRoute,
} from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import Markdown from "react-markdown"

import { MeetingService } from "@/client/sdk.gen" // 新增：引入 MeetingService

export const Route = createFileRoute("/digest")({
    component: Digest,
})

function Digest() {
    const { register, handleSubmit, reset } = useForm<{ content: string }>()
    const [result, setResult] = useState("")
    const [history, setHistory] = useState<{ time: string, content: string, summary: string }[]>([])
    const [page, setPage] = useState(1)
    const pageSize = 5
    const [totalPages, setTotalPages] = useState(1)
    const [modalContent, setModalContent] = useState("")
    const [loading, setLoading] = useState(false)

    // 获取会议纪要历史数据
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const skip = (page - 1) * pageSize
                const res = await MeetingService.readMeetingHistory({ skip, limit: pageSize })
                // 假设返回结构为 { items: [{ created_at, digest }], total }
                setHistory(
                    (res.data ?? []).map(data => ({
                        time: data.created_at ?? "",
                        content: data.content ?? "",
                        summary: data.summary ?? "",
                    }))
                )
                setTotalPages(Math.max(1, Math.ceil((res.count ?? 0) / pageSize)))
            } catch (e) {
                setHistory([])
                setTotalPages(1)
            }
        }
        fetchHistory()
    }, [page, pageSize])

    // 示例提交处理
    const onSubmit = async (data: { content: string }) => {
        setLoading(true)
        try {
            // 使用 MeetingService.digest 提交会议纪要
            const res = await MeetingService.digest({ requestBody: { content: data.content } })
            // 假设返回结构为 { summary: string }
            setResult(res.summary ?? "No summary returned.")
            setHistory(prev => [
                { time: new Date().toLocaleString(), content: data.content, summary: res.summary ?? "" },
                ...prev,
            ])
        } catch (err) {
            setResult("Failed to get summary from server.")
        }
        setLoading(false)
        reset()
    }

    // 截断文本工具
    const truncate = (text: string, len = 60) => {
        if (!text) return ""
        return text.length > len ? text.slice(0, len) + "..." : text
    }

    // 查看全文处理
    const [open, setOpen] = useState(false)

    const handleShowFull = (text: string) => {
        setModalContent(text)
        setOpen(true)
    }

    return (
        <Container maxW="container.lg" py={8}>
            <Text fontSize="3xl" fontWeight="bold" mb={8} textAlign="center">
                AI Meeting Digest
            </Text>
            {/* 第一行：输入、提交、结果 */}
            <Grid templateColumns="2fr 1fr 2fr" gap={4} mb={8}>
                <GridItem>
                    <Textarea
                        placeholder="Enter meeting minutes"
                        minH="120px"
                        {...register("content", { required: true })}
                        contentEditable={loading}
                    />
                </GridItem>
                <GridItem display="flex" alignItems="center" justifyContent="center">
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit(onSubmit)}
                        disabled={loading}
                    >
                        Submit
                    </Button>
                </GridItem>
                <GridItem>
                    <Box borderWidth={1} borderRadius="md" p={4} minH="120px" bg="gray.50">
                        <Text fontWeight="bold" mb={2}>Meeting Summary</Text>
                        <Prose mx="auto">
                            {loading
                                ? <Text color="gray.400">Loading...</Text>
                                : <Markdown>{result}</Markdown>
                            }
                        </Prose>
                    </Box>
                </GridItem>
            </Grid>

            {/* 第二行：历史数据表格 */}
            <Box borderWidth={1} borderRadius="md" p={4} bg="white">
                <Table.Root size="sm">
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>Time</Table.Cell>
                            <Table.Cell>Meeting Minutes</Table.Cell>
                            <Table.Cell>Summary</Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {history.map((item, idx) => (
                            <Table.Row key={idx}>
                                <Table.Cell>{item.time}</Table.Cell>
                                <Table.Cell>
                                    <Box
                                        as="span"
                                        cursor={item.content.length > 60 ? "pointer" : "default"}
                                        color={item.content.length > 60 ? "blue.500" : "inherit"}
                                        onClick={() => item.content.length > 60 && handleShowFull(item.content)}
                                        title={item.content.length > 60 ? "Click to view full text" : undefined}
                                    >
                                        <Prose mx="auto">
                                            <Markdown>{truncate(item.content)}</Markdown>
                                        </Prose>
                                    </Box>
                                </Table.Cell>
                                <Table.Cell>
                                    <Box
                                        as="span"
                                        cursor={item.summary.length > 60 ? "pointer" : "default"}
                                        color={item.summary.length > 60 ? "blue.500" : "inherit"}
                                        onClick={() => item.summary.length > 60 && handleShowFull(item.summary)}
                                        title={item.summary.length > 60 ? "Click to view full text" : undefined}
                                    >
                                        <Prose mx="auto">
                                            <Markdown>{truncate(item.summary)}</Markdown>
                                        </Prose>
                                    </Box>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
                {/* 分页控件 */}
                <Box mt={4} display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                    <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Text fontSize="sm">Page {page} / {totalPages}</Text>
                    <Button size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </Box>
            </Box>
            {/* 查看全文弹窗，使用 Dialog 替换 Modal */}
            <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="cover" placement="center" motionPreset="slide-in-bottom" scrollBehavior="inside">
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Full Text</Dialog.Title>
                                <Dialog.CloseTrigger asChild>
                                    <CloseButton size="sm" />
                                </Dialog.CloseTrigger>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Box maxHeight="60vh" overflowY="auto">
                                    <Prose mx="auto">
                                        <Markdown>{modalContent}</Markdown>
                                    </Prose>
                                </Box>
                            </Dialog.Body>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Container>
    )
}

export default Digest
