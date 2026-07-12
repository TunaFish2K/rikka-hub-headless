package me.rerere.rikkahub.web.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.delete
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.coroutines.flow.first
import kotlinx.serialization.Serializable
import me.rerere.rikkahub.data.files.SkillManager
import me.rerere.rikkahub.data.repository.WorkspaceRepository
import me.rerere.rikkahub.web.BadRequestException
import me.rerere.rikkahub.web.NotFoundException

private const val DEFAULT_ROOTFS_URL =
    "https://cdimage.ubuntu.com/ubuntu-base/releases/24.04/release/ubuntu-base-24.04.3-base-arm64.tar.gz"

@Serializable
data class CreateWorkspaceRequest(val name: String)

@Serializable
data class InstallWorkspaceRequest(val url: String = DEFAULT_ROOTFS_URL)

@Serializable
data class WorkspaceResponse(
    val id: String,
    val name: String,
    val shellStatus: String,
    val createdAt: Long,
    val updatedAt: Long,
)

@Serializable
data class SkillResponse(
    val name: String,
    val description: String,
    val compatibility: String? = null,
    val allowedTools: List<String> = emptyList(),
)

fun Route.headlessRoutes(
    workspaceRepository: WorkspaceRepository,
    skillManager: SkillManager,
) {
    route("/workspaces") {
        get {
            call.respond(workspaceRepository.listFlow().first().map {
                WorkspaceResponse(it.id, it.name, it.shellStatus, it.createdAt, it.updatedAt)
            })
        }
        post {
            val request = call.receive<CreateWorkspaceRequest>()
            if (request.name.isBlank()) throw BadRequestException("Workspace name is required")
            val workspace = workspaceRepository.create(request.name)
            call.respond(
                HttpStatusCode.Created,
                WorkspaceResponse(
                    workspace.id, workspace.name, workspace.shellStatus,
                    workspace.createdAt, workspace.updatedAt
                )
            )
        }
        post("/{id}/install") {
            val id = call.parameters["id"] ?: throw BadRequestException("Missing workspace id")
            val request = call.receive<InstallWorkspaceRequest>()
            if (!workspaceRepository.installRootfs(id, request.url)) {
                throw NotFoundException("Workspace not found")
            }
            call.respond(HttpStatusCode.Accepted)
        }
        delete("/{id}") {
            val id = call.parameters["id"] ?: throw BadRequestException("Missing workspace id")
            if (!workspaceRepository.delete(id)) throw NotFoundException("Workspace not found")
            call.respond(HttpStatusCode.OK, mapOf("deleted" to true))
        }
    }
    get("/skills") {
        call.respond(skillManager.listSkills().map {
            SkillResponse(it.name, it.description, it.compatibility, it.allowedTools)
        })
    }
}
