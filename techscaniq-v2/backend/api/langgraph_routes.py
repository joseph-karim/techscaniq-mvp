"""
LangGraph Reports API Endpoints

Provides HTTP API for accessing LangGraph-generated reports.
Integrates with the pipeline output and frontend rendering.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import os
import logging
from pathlib import Path
from datetime import datetime
import glob

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/langgraph", tags=["langgraph"])


class ReportStatus(BaseModel):
    """Report generation status"""
    reportId: str
    status: str  # "completed", "in_progress", "failed", "not_found"
    progress: int  # 0-100
    currentPhase: str
    evidenceCount: int
    lastUpdated: str
    estimatedTimeRemaining: str


class ReportListItem(BaseModel):
    """Report list item"""
    id: str
    title: str
    created: str
    size: int
    status: str
    evidenceCount: int


class ReportListResponse(BaseModel):
    """Report list response"""
    reports: List[ReportListItem]
    total: int


def get_report_paths(report_id: str) -> List[str]:
    """Get all possible paths where a report might be located"""
    base_paths = [
        "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/scripts/data/integrated-results",
        "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/data/integrated-results",
        "/Users/josephkarim/techscaniq-mvp/public/data/langgraph-reports"
    ]
    
    report_patterns = [
        f"{report_id}.json",
        f"cibc-adobe-integrated-{report_id}.json",
        f"cibc-latest-{report_id}.json",
        f"{report_id}-*.json"
    ]
    
    paths = []
    for base_path in base_paths:
        for pattern in report_patterns:
            full_pattern = os.path.join(base_path, pattern)
            paths.extend(glob.glob(full_pattern))
    
    return paths


def find_report_file(report_id: str) -> Optional[str]:
    """Find the report file for a given report ID"""
    paths = get_report_paths(report_id)
    
    for path in paths:
        if os.path.exists(path):
            return path
    
    return None


def extract_report_metadata(file_path: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from report file and data"""
    try:
        stat = os.stat(file_path)
        evidence_count = 0
        
        # Try to count evidence from different possible structures
        if 'evidence' in data:
            evidence_count = len(data['evidence'])
        elif 'evidenceItems' in data:
            evidence_count = len(data['evidenceItems'])
        elif 'sections' in data:
            # Count evidence across sections
            for section in data['sections']:
                if 'evidence' in section:
                    evidence_count += len(section['evidence'])
        
        return {
            "file_path": file_path,
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "evidence_count": evidence_count
        }
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {e}")
        return {
            "file_path": file_path,
            "size": 0,
            "modified": datetime.now().isoformat(),
            "evidence_count": 0
        }


@router.get("/{report_id}")
async def get_langgraph_report(report_id: str):
    """Get LangGraph report by ID"""
    try:
        file_path = find_report_file(report_id)
        
        if not file_path:
            logger.warning(f"Report not found: {report_id}")
            raise HTTPException(status_code=404, detail=f"Report not found: {report_id}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Add metadata
        metadata = extract_report_metadata(file_path, data)
        data['_metadata'] = metadata
        
        logger.info(f"Successfully loaded report {report_id} from {file_path}")
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in report {report_id}: {e}")
        raise HTTPException(status_code=500, detail="Invalid report format")
    except Exception as e:
        logger.error(f"Error loading report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading report: {str(e)}")


@router.get("/{report_id}/status")
async def get_report_status(report_id: str) -> ReportStatus:
    """Get report generation status"""
    try:
        file_path = find_report_file(report_id)
        
        if not file_path:
            return ReportStatus(
                reportId=report_id,
                status="not_found",
                progress=0,
                currentPhase="not_started",
                evidenceCount=0,
                lastUpdated="",
                estimatedTimeRemaining="unknown"
            )
        
        # Load report to get evidence count
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            metadata = extract_report_metadata(file_path, data)
            
            return ReportStatus(
                reportId=report_id,
                status="completed",
                progress=100,
                currentPhase="completed",
                evidenceCount=metadata["evidence_count"],
                lastUpdated=metadata["modified"],
                estimatedTimeRemaining="0m"
            )
            
        except Exception as e:
            logger.error(f"Error reading report {report_id}: {e}")
            return ReportStatus(
                reportId=report_id,
                status="failed",
                progress=0,
                currentPhase="error",
                evidenceCount=0,
                lastUpdated=datetime.now().isoformat(),
                estimatedTimeRemaining="unknown"
            )
            
    except Exception as e:
        logger.error(f"Error checking report status {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error checking report status: {str(e)}")


@router.get("/")
async def list_langgraph_reports(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0)
) -> ReportListResponse:
    """List all available LangGraph reports"""
    try:
        reports = []
        
        # Scan all possible report directories
        base_paths = [
            "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/scripts/data/integrated-results",
            "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/data/integrated-results",
            "/Users/josephkarim/techscaniq-mvp/public/data/langgraph-reports"
        ]
        
        seen_reports = set()
        
        for base_path in base_paths:
            if not os.path.exists(base_path):
                continue
                
            for file_path in glob.glob(os.path.join(base_path, "*.json")):
                try:
                    file_name = os.path.basename(file_path)
                    
                    # Skip if we've already seen this report
                    if file_name in seen_reports:
                        continue
                    seen_reports.add(file_name)
                    
                    # Extract report ID from filename
                    report_id = file_name.replace('.json', '')
                    
                    # Load file to get metadata
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    metadata = extract_report_metadata(file_path, data)
                    
                    # Extract title from report data
                    title = data.get('title', data.get('reportTitle', report_id))
                    if not title or title == report_id:
                        # Generate a more readable title
                        if 'cibc' in report_id.lower():
                            title = "CIBC Technical Analysis Report"
                        else:
                            title = f"Technical Analysis Report - {report_id}"
                    
                    reports.append(ReportListItem(
                        id=report_id,
                        title=title,
                        created=metadata["modified"],
                        size=metadata["size"],
                        status="completed",
                        evidenceCount=metadata["evidence_count"]
                    ))
                    
                except Exception as e:
                    logger.error(f"Error processing report file {file_path}: {e}")
                    continue
        
        # Sort by creation date (newest first)
        reports.sort(key=lambda x: x.created, reverse=True)
        
        # Apply pagination
        total = len(reports)
        reports = reports[offset:offset + limit]
        
        logger.info(f"Listed {len(reports)} reports (total: {total})")
        return ReportListResponse(reports=reports, total=total)
        
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing reports: {str(e)}")


@router.get("/health")
async def langgraph_health():
    """Health check for LangGraph reports service"""
    try:
        # Check if report directories exist and are accessible
        base_paths = [
            "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/scripts/data/integrated-results",
            "/Users/josephkarim/techscaniq-mvp/techscaniq-v2/data/integrated-results",
            "/Users/josephkarim/techscaniq-mvp/public/data/langgraph-reports"
        ]
        
        accessible_paths = []
        total_reports = 0
        
        for path in base_paths:
            if os.path.exists(path) and os.access(path, os.R_OK):
                accessible_paths.append(path)
                total_reports += len(glob.glob(os.path.join(path, "*.json")))
        
        return {
            "status": "healthy" if accessible_paths else "degraded",
            "accessible_paths": accessible_paths,
            "total_paths": len(base_paths),
            "total_reports": total_reports,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"LangGraph health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }